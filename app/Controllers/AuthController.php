<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Auth;
use ImperioAcai\Database;
use ImperioAcai\HttpException;
use ImperioAcai\Request;
use ImperioAcai\Validator;

final class AuthController
{
    public function login(Request $request): array
    {
        $data = Validator::validate($request->body(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Pequeno atraso para dificultar forca bruta
        usleep(250_000);

        $user = Auth::login($data['email'], $data['password']);
        return ['user' => $user, 'csrf' => Auth::csrfToken()];
    }

    public function logout(Request $request): ?array
    {
        Auth::logout();
        return null;
    }

    public function me(Request $request): array
    {
        return ['user' => Auth::requireUser(), 'csrf' => Auth::csrfToken()];
    }

    public function changePassword(Request $request): array
    {
        $user = Auth::requireUser();
        $data = Validator::validate($request->body(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|max:72',
        ]);

        $row = Database::one('SELECT password_hash FROM users WHERE id = ?', [(int) $user['id']]);
        if (!$row || !password_verify($data['current_password'], $row['password_hash'])) {
            throw HttpException::unprocessable('Senha atual incorreta.', ['current_password' => 'Senha atual incorreta.']);
        }

        Database::update('users', (int) $user['id'], [
            'password_hash' => password_hash($data['new_password'], PASSWORD_BCRYPT),
        ]);

        return ['ok' => true];
    }
}
