/*
<?php
header('Content-Type: application/json; charset=utf-8');

$hoje = new DateTime();

/* Estudos */
$dataInicioEstudo = new DateTime('2024-01-01');
$diasEstudo = $dataInicioEstudo->diff($hoje)->days;
$horasEstudoPorDia = 5;
$horasEstudo = $diasEstudo * $horasEstudoPorDia;

/* Trabalho */
$dataInicioWork = new DateTime('2025-09-23');
$diasWork = $dataInicioWork->diff($hoje)->days;
$horasWorkPorDia = 8;
$horasWork = $diasWork * $horasWorkPorDia;

/* Retorno */
echo json_encode([
    'horas_estudo' => (int)$horasEstudo,
    'horas_trabalho' => (int)$horasWork,
    'horas_atividade' => 6,
    'horas_pratica' => 532
]);
*/