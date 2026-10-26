<?php
declare(strict_types=1);

namespace ImperioAcai;

/**
 * Validador minimalista. Regras: required, string, int, bool, decimal, url, max:N, in:a,b,c
 */
final class Validator
{
    /**
     * @param array<string,string> $rules  campo => "required|string|max:120"
     * @return array dados filtrados e normalizados (somente campos presentes)
     */
    public static function validate(array $input, array $rules, bool $partial = false): array
    {
        $errors = [];
        $clean = [];

        foreach ($rules as $field => $ruleString) {
            $ruleList = explode('|', $ruleString);
            $exists = array_key_exists($field, $input);
            $value = $input[$field] ?? null;

            if (!$exists) {
                if (in_array('required', $ruleList, true) && !$partial) {
                    $errors[$field] = 'Campo obrigatório.';
                }
                continue;
            }

            if (is_string($value)) {
                $value = trim($value);
            }
            if ($value === '' || $value === null) {
                if (in_array('required', $ruleList, true)) {
                    $errors[$field] = 'Campo obrigatório.';
                    continue;
                }
                $clean[$field] = null;
                continue;
            }

            foreach ($ruleList as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                switch ($name) {
                    case 'string':
                        if (!is_string($value)) { $errors[$field] = 'Deve ser texto.'; break 2; }
                        break;
                    case 'int':
                        if (!is_numeric($value) || (int) $value != $value) { $errors[$field] = 'Deve ser um número inteiro.'; break 2; }
                        $value = (int) $value;
                        break;
                    case 'bool':
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                        if ($value === null) { $errors[$field] = 'Deve ser verdadeiro ou falso.'; break 2; }
                        $value = $value ? 1 : 0;
                        break;
                    case 'decimal':
                        if (is_string($value)) {
                            $value = str_replace(['R$', ' '], '', $value);
                            if (str_contains($value, ',')) {
                                $value = str_replace('.', '', $value);
                                $value = str_replace(',', '.', $value);
                            }
                        }
                        if (!is_numeric($value)) { $errors[$field] = 'Valor inválido.'; break 2; }
                        $value = round((float) $value, 2);
                        break;
                    case 'url':
                        if (!is_string($value) || (!filter_var($value, FILTER_VALIDATE_URL) && !str_starts_with($value, '/'))) {
                            $errors[$field] = 'URL inválida.'; break 2;
                        }
                        break;
                    case 'email':
                        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) { $errors[$field] = 'E-mail inválido.'; break 2; }
                        $value = mb_strtolower($value);
                        break;
                    case 'max':
                        if (is_string($value) && mb_strlen($value) > (int) $arg) { $errors[$field] = "Máximo de $arg caracteres."; break 2; }
                        break;
                    case 'min':
                        if (is_string($value) && mb_strlen($value) < (int) $arg) { $errors[$field] = "Mínimo de $arg caracteres."; break 2; }
                        break;
                    case 'in':
                        if (!in_array((string) $value, explode(',', (string) $arg), true)) { $errors[$field] = 'Valor não permitido.'; break 2; }
                        break;
                    case 'slug':
                        $value = self::slugify((string) $value);
                        break;
                }
            }

            if (!isset($errors[$field])) {
                $clean[$field] = $value;
            }
        }

        if ($errors) {
            throw HttpException::unprocessable('Verifique os campos informados.', $errors);
        }
        return $clean;
    }

    public static function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $map = ['á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e','í'=>'i','ì'=>'i','î'=>'i','ï'=>'i','ó'=>'o','ò'=>'o','õ'=>'o','ô'=>'o','ö'=>'o','ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ç'=>'c','ñ'=>'n'];
        $text = strtr($text, $map);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        return trim($text, '-') ?: 'item';
    }
}
