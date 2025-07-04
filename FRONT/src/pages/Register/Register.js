import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import './Register.css';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('senha');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.nome, data.email, data.senha);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">EntregArt</h1>
          <p className="register-subtitle">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
          <div className="form-group">
            <label htmlFor="nome" className="form-label">
              Nome completo
            </label>
            <input
              type="text"
              id="nome"
              className={`form-input ${errors.nome ? 'form-input-error' : ''}`}
              placeholder="Digite seu nome completo"
              {...register('nome', {
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Nome deve ter pelo menos 2 caracteres'
                }
              })}
            />
            {errors.nome && (
              <span className="form-error">{errors.nome.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="Digite seu e-mail"
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido'
                }
              })}
            />
            {errors.email && (
              <span className="form-error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="senha" className="form-label">
              Senha
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="senha"
                className={`form-input ${errors.senha ? 'form-input-error' : ''}`}
                placeholder="Digite sua senha"
                {...register('senha', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres'
                  }
                })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.senha && (
              <span className="form-error">{errors.senha.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha" className="form-label">
              Confirmar senha
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmarSenha"
                className={`form-input ${errors.confirmarSenha ? 'form-input-error' : ''}`}
                placeholder="Confirme sua senha"
                {...register('confirmarSenha', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === password || 'Senhas não coincidem'
                })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmarSenha && (
              <span className="form-error">{errors.confirmarSenha.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <div className="btn-loading">
                <div className="loading-spinner small"></div>
                Criando conta...
              </div>
            ) : (
              <>
                <UserPlus size={20} />
                Criar conta
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Já tem uma conta?{' '}
            <Link to="/login" className="register-link">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;