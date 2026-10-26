<?php
/**
 * Copie este arquivo para config.php e preencha com os dados da Hostinger
 * (hPanel > Bancos de dados > MySQL).
 *
 * Em desenvolvimento (Docker) este arquivo nao e necessario: as variaveis
 * de ambiente do docker-compose.yml sao usadas automaticamente.
 */
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'u000000000_imperioacai',
        'user' => 'u000000000_imperioacai',
        'pass' => 'SENHA_DO_BANCO',
        'charset' => 'utf8mb4',
    ],

    // Chave aleatoria usada para assinar tokens CSRF. Gere com: openssl rand -hex 32
    'app_key' => 'TROQUE_POR_UMA_CHAVE_ALEATORIA',

    // 'production' esconde detalhes de erro nas respostas JSON
    'app_env' => 'production',

    // Uploads: por padrao vao para a pasta "uploads" dentro do public_html.
    // 'dir' pode ser informado para usar outro caminho absoluto.
    'uploads' => [
        // 'dir' => '/home/u000000000/domains/seudominio.com.br/public_html/uploads',
        'public_path' => '/uploads',
        'max_mb' => 5,
    ],
];
