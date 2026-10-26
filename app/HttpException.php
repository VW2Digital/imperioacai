<?php
declare(strict_types=1);

namespace ImperioAcai;

class HttpException extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly ?array $details = null
    ) {
        parent::__construct($message);
    }

    public static function badRequest(string $message, ?array $details = null): self
    {
        return new self(400, $message, $details);
    }

    public static function unauthorized(string $message = 'Não autenticado.'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'Acesso negado.'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message = 'Registro não encontrado.'): self
    {
        return new self(404, $message);
    }

    public static function conflict(string $message): self
    {
        return new self(409, $message);
    }

    public static function unprocessable(string $message, ?array $details = null): self
    {
        return new self(422, $message, $details);
    }
}
