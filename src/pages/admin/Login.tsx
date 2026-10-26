import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/http";
import { Button, Field, Input } from "../../components/admin/ui";
import styles from "./Login.module.css";

interface Form {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    document.title = "Painel — Império Açaí";
  }, []);

  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível entrar.");
    }
  });

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <div className={styles.brand}>
          <span>IA</span>
          <h1>Painel Império Açaí</h1>
          <p>Entre para gerenciar o cardápio</p>
        </div>

        <Field label="E-mail" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="username" autoFocus {...register("email", { required: "Informe o e-mail." })} />
        </Field>
        <Field label="Senha" error={formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password", { required: "Informe a senha." })} />
        </Field>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" loading={formState.isSubmitting} className={styles.submit}>
          Entrar
        </Button>

        <a href="/" className={styles.back}>
          ← Voltar ao site
        </a>
      </form>
    </main>
  );
}
