<?php
declare(strict_types=1);

namespace ImperioAcai;

/**
 * Autenticacao do painel admin por sessao PHP (cookie HttpOnly) + token CSRF.
 */
final class Auth
{
    private const SESSION_NAME = 'imperioacai_sess';

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

        session_name(self::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function login(string $email, string $password): array
    {
        $user = Database::one('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1', [mb_strtolower(trim($email))]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw HttpException::unauthorized('E-mail ou senha inválidos.');
        }
        self::start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        unset($user['password_hash']);
        return $user;
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $p['path'],
                'secure' => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => $p['samesite'],
            ]);
        }
        session_destroy();
    }

    public static function user(): ?array
    {
        self::start();
        $id = $_SESSION['user_id'] ?? null;
        if (!$id) {
            return null;
        }
        return Database::one('SELECT id, name, email FROM users WHERE id = ?', [(int) $id]);
    }

    public static function requireUser(): array
    {
        $user = self::user();
        if (!$user) {
            throw HttpException::unauthorized();
        }
        return $user;
    }

    public static function csrfToken(): string
    {
        self::start();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function verifyCsrf(Request $request): void
    {
        self::start();
        $sent = $request->header('X-CSRF-Token') ?? '';
        $expected = $_SESSION['csrf'] ?? '';
        if ($sent === '' || $expected === '' || !hash_equals($expected, $sent)) {
            throw HttpException::forbidden('Token CSRF inválido. Recarregue a página e tente novamente.');
        }
    }
}
