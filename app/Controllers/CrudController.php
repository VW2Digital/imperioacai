<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\HttpException;
use ImperioAcai\Request;
use ImperioAcai\Validator;

/**
 * CRUD generico para recursos ordenaveis do admin.
 */
abstract class CrudController
{
    protected string $table;
    /** @var array<string,string> regras de validacao campo => regras */
    protected array $rules = [];
    protected string $orderBy = 'sort_order, id';

    /** Permite transformar a linha antes de devolver (tipos, joins). */
    protected function present(array $row): array
    {
        $row['id'] = (int) $row['id'];
        if (array_key_exists('active', $row)) {
            $row['active'] = (bool) $row['active'];
        }
        if (array_key_exists('sort_order', $row)) {
            $row['sort_order'] = (int) $row['sort_order'];
        }
        return $row;
    }

    protected function selectSql(): string
    {
        return "SELECT * FROM `{$this->table}`";
    }

    protected function beforeSave(array $data, ?int $id): array
    {
        return $data;
    }

    protected function beforeDelete(int $id): void
    {
    }

    public function index(Request $request): array
    {
        $rows = Database::all($this->selectSql() . " ORDER BY {$this->orderBy}");
        return array_map([$this, 'present'], $rows);
    }

    public function show(Request $request): array
    {
        return $this->present($this->find((int) $request->param('id')));
    }

    public function store(Request $request): array
    {
        $data = Validator::validate($request->body(), $this->rules);
        $data = $this->beforeSave($data, null);

        if (!array_key_exists('sort_order', $data) || $data['sort_order'] === null) {
            $max = Database::one("SELECT COALESCE(MAX(sort_order), 0) AS m FROM `{$this->table}`");
            $data['sort_order'] = (int) ($max['m'] ?? 0) + 1;
        }
        if (!array_key_exists('active', $data) || $data['active'] === null) {
            $data['active'] = 1;
        }

        $id = Database::insert($this->table, $data);
        return $this->present($this->find($id));
    }

    public function update(Request $request): array
    {
        $id = (int) $request->param('id');
        $this->find($id);

        $data = Validator::validate($request->body(), $this->rules, partial: true);
        $data = $this->beforeSave($data, $id);
        Database::update($this->table, $id, $data);

        return $this->present($this->find($id));
    }

    public function destroy(Request $request): ?array
    {
        $id = (int) $request->param('id');
        $this->find($id);
        $this->beforeDelete($id);

        try {
            Database::run("DELETE FROM `{$this->table}` WHERE id = ?", [$id]);
        } catch (\PDOException $e) {
            if (($e->errorInfo[1] ?? 0) === 1451) {
                throw HttpException::conflict('Não é possível excluir: existem registros vinculados.');
            }
            throw $e;
        }
        return null;
    }

    /** PUT .../reorder  body: { "ids": [3, 1, 2] } */
    public function reorder(Request $request): array
    {
        $ids = $request->body()['ids'] ?? null;
        if (!is_array($ids) || $ids === []) {
            throw HttpException::badRequest('Informe a lista "ids".');
        }
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE `{$this->table}` SET sort_order = ? WHERE id = ?");
            foreach (array_values($ids) as $i => $id) {
                $stmt->execute([$i + 1, (int) $id]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        return ['ok' => true];
    }

    protected function find(int $id): array
    {
        $row = Database::one($this->selectSql() . ' WHERE id = ?', [$id]);
        if (!$row) {
            throw HttpException::notFound();
        }
        return $row;
    }
}
