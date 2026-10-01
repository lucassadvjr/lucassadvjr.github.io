import json
import struct
import sys
from pathlib import Path


def padded(data: bytes, fill: bytes) -> bytes:
    return data + fill * ((-len(data)) % 4)


path = Path(sys.argv[1])
raw = path.read_bytes()
magic, version, total_length = struct.unpack_from("<4sII", raw, 0)
if magic != b"glTF" or version != 2 or total_length != len(raw):
    raise SystemExit("Expected a valid GLB 2.0 file")

json_length, json_type = struct.unpack_from("<II", raw, 12)
json_start = 20
json_end = json_start + json_length
document = json.loads(raw[json_start:json_end].decode("utf-8").rstrip("\x00 "))

bin_length, bin_type = struct.unpack_from("<II", raw, json_end)
bin_start = json_end + 8
bin_data = bytearray(raw[bin_start:bin_start + bin_length])

# Keep the six source accessors/views if this utility is rerun on its own output.
# This makes recoloring deterministic instead of appending duplicate index data.
document["accessors"] = document["accessors"][:6]
document["bufferViews"] = document["bufferViews"][:2]
source_binary_length = max(view.get("byteOffset", 0) + view["byteLength"] for view in document["bufferViews"])
bin_data = bin_data[:source_binary_length]

if len(document.get("meshes", [])) < 2:
    raise SystemExit("Expected separate steam and cup meshes")

document["materials"] = [
    {
        "name": "Java Steam Red",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.949, 0.224, 0.055, 1.0],
            "metallicFactor": 0.12,
            "roughnessFactor": 0.34,
        },
    },
    {
        "name": "Java Cup Blue",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.020, 0.337, 0.635, 1.0],
            "metallicFactor": 0.16,
            "roughnessFactor": 0.3,
        },
    },
]

component_formats = {
    5121: ("B", 1),
    5123: ("H", 2),
    5125: ("I", 4),
}


def read_positions(accessor_index: int):
    accessor = document["accessors"][accessor_index]
    view = document["bufferViews"][accessor["bufferView"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", 12)
    return [struct.unpack_from("<fff", bin_data, offset + i * stride) for i in range(accessor["count"])]


def read_indices(accessor_index: int):
    accessor = document["accessors"][accessor_index]
    view = document["bufferViews"][accessor["bufferView"]]
    code, size = component_formats[accessor["componentType"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", size)
    return [struct.unpack_from("<" + code, bin_data, offset + i * stride)[0] for i in range(accessor["count"])]


def append_indices(indices):
    while len(bin_data) % 4:
        bin_data.append(0)
    byte_offset = len(bin_data)
    bin_data.extend(struct.pack("<" + "I" * len(indices), *indices))
    view_index = len(document["bufferViews"])
    document["bufferViews"].append({
        "buffer": 0,
        "byteOffset": byte_offset,
        "byteLength": len(indices) * 4,
        "target": 34963,
    })
    accessor_index = len(document["accessors"])
    document["accessors"].append({
        "bufferView": view_index,
        "componentType": 5125,
        "count": len(indices),
        "type": "SCALAR",
        "min": [min(indices)],
        "max": [max(indices)],
    })
    return accessor_index


# Both source meshes contain pieces across the complete sculpture. Split their
# triangles by height so the upper steam is Java red and the cup/base is blue.
for mesh_index, mesh in enumerate(document["meshes"]):
    source = mesh["primitives"][0]
    positions = read_positions(source["attributes"]["POSITION"])
    indices = read_indices((2, 5)[mesh_index])
    steam_indices = []
    cup_indices = []
    for start in range(0, len(indices), 3):
        triangle = indices[start:start + 3]
        average_y = sum(positions[index][1] for index in triangle) / 3
        (steam_indices if average_y > -0.1 else cup_indices).extend(triangle)
    shared = {key: value for key, value in source.items() if key not in {"indices", "material"}}
    mesh["primitives"] = [
        {**shared, "indices": append_indices(steam_indices), "material": 0},
        {**shared, "indices": append_indices(cup_indices), "material": 1},
    ]

document["buffers"][0]["byteLength"] = len(bin_data)

json_chunk = padded(json.dumps(document, separators=(",", ":")).encode("utf-8"), b" ")
binary_chunk = padded(bytes(bin_data), b"\x00")
new_total = 12 + 8 + len(json_chunk) + 8 + len(binary_chunk)
output = struct.pack("<4sII", b"glTF", 2, new_total)
output += struct.pack("<II", len(json_chunk), json_type) + json_chunk
output += struct.pack("<II", len(binary_chunk), bin_type) + binary_chunk

temporary = path.with_suffix(".glb.tmp")
temporary.write_bytes(output)
temporary.replace(path)
