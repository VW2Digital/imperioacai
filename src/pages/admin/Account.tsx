import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../lib/auth";
import { api, ApiError } from "../../lib/http";
import { useToast } from "../../components/ui/Toast";
import { Button, Card, Field, FormActions, Input, PageHeader } from "../../components/admin/ui";
import styles from "./Settings.module.css";

interface Form {
  current_password: string;
  new_password: string;
  confirm: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError, watch, formState } = useForm<Form>({
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await api("/data/auth/password", {
        method: "PUT",
        body: { current_password: data.current_password, new_password: data.new_password },
      });
      toast.success("Senha alterada com sucesso.");
      reset();
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        Object.entries(e.details ?? {}).forEach(([f, m]) => setError(f as keyof Form, { message: m }));
      } else setServerError("Erro inesperado.");
    }
  });

  return (
    <>
      <PageHeader title="Minha conta" subtitle={user?.email} />
      <form onSubmit={submit} noValidate className={styles.form} style={{ maxWidth: 480 }}>
        <Card>
          <h2 className={styles.sectionTitle}>Alterar senha</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Senha atual" error={formState.errors.current_password?.message}>
              <Input type="password" autoComplete="current-password" {...register("current_password", { required: "Informe a senha atual." })} />
            </Field>
            <Field label="Nova senha" error={formState.errors.new_password?.message}>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("new_password", { required: "Informe a nova senha.", minLength: { value: 6, message: "Mínimo de 6 caracteres." } })}
              />
            </Field>
            <Field label="Confirmar nova senha" error={formState.errors.confirm?.message}>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("confirm", { validate: (v) => v === watch("new_password") || "As senhas não conferem." })}
              />
            </Field>
          </div>
          {serverError && <p className={styles.error} style={{ marginTop: 12 }}>{serverError}</p>}
          <FormActions>
            <Button type="submit" loading={formState.isSubmitting}>
              Salvar nova senha
            </Button>
          </FormActions>
        </Card>
      </form>
    </>
  );
}
