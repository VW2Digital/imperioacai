<?php
declare(strict_types=1);

namespace ImperioAcai;

final class Upload
{
    private const ALLOWED = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /**
     * Salva um arquivo de $_FILES[$field] e devolve o caminho publico (/uploads/xxx.jpg).
     */
    public static function image(string $field = 'file'): string
    {
        $file = $_FILES[$field] ?? null;
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            throw HttpException::badRequest('Nenhum arquivo enviado.');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw HttpException::badRequest('Falha no upload (código ' . $file['error'] . ').');
        }

        $cfg = config()['uploads'];
        $maxBytes = (int) $cfg['max_mb'] * 1024 * 1024;
        if ($file['size'] > $maxBytes) {
            throw HttpException::unprocessable("Imagem muito grande. Máximo: {$cfg['max_mb']} MB.");
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']) ?: '';
        if (!isset(self::ALLOWED[$mime])) {
            throw HttpException::unprocessable('Formato inválido. Use JPG, PNG, WEBP ou GIF.');
        }
        if (@getimagesize($file['tmp_name']) === false) {
            throw HttpException::unprocessable('O arquivo não é uma imagem válida.');
        }

        $dir = rtrim($cfg['dir'], '/');
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new HttpException(500, 'Não foi possível criar a pasta de uploads.');
        }

        $name = date('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . self::ALLOWED[$mime];
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            throw new HttpException(500, 'Não foi possível salvar a imagem.');
        }
        @chmod($dest, 0644);

        return rtrim($cfg['public_path'], '/') . '/' . $name;
    }
}
