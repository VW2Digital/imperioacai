<?php
declare(strict_types=1);

namespace ImperioAcai;

final class Router
{
    /** @var array<int, array{method:string, regex:string, names:string[], handler:callable|array, auth:bool}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable|array $handler, bool $auth = false): void
    {
        $names = [];
        $regex = preg_replace_callback('#\{(\w+)\}#', static function (array $m) use (&$names): string {
            $names[] = $m[1];
            return '([^/]+)';
        }, $pattern);
        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'names' => $names,
            'handler' => $handler,
            'auth' => $auth,
        ];
    }

    public function get(string $p, callable|array $h, bool $auth = false): void { $this->add('GET', $p, $h, $auth); }
    public function post(string $p, callable|array $h, bool $auth = false): void { $this->add('POST', $p, $h, $auth); }
    public function put(string $p, callable|array $h, bool $auth = false): void { $this->add('PUT', $p, $h, $auth); }
    public function delete(string $p, callable|array $h, bool $auth = false): void { $this->add('DELETE', $p, $h, $auth); }

    public function dispatch(Request $request): never
    {
        $methodAllowed = false;
        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $request->path, $matches)) {
                continue;
            }
            $methodAllowed = true;
            if ($route['method'] !== $request->method) {
                continue;
            }

            array_shift($matches);
            $request->params = array_combine($route['names'], array_map('urldecode', $matches)) ?: [];

            if ($route['auth']) {
                Auth::requireUser();
                if (!in_array($request->method, ['GET', 'HEAD', 'OPTIONS'], true)) {
                    Auth::verifyCsrf($request);
                }
            }

            $handler = $route['handler'];
            if (is_array($handler) && is_string($handler[0])) {
                $handler = [new $handler[0](), $handler[1]];
            }
            $result = $handler($request);
            if ($result === null) {
                Response::noContent();
            }
            Response::json($result);
        }

        if ($methodAllowed) {
            throw new HttpException(405, 'Método não permitido.');
        }
        throw HttpException::notFound('Rota não encontrada.');
    }
}
