import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form para dados do perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile }
  } = useForm({
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || ''
    }
  });

  // Form para senha
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch,
    reset: resetPassword,
    formState: { errors: errorsPassword }
  } = useForm();

  const newPassword = watch('novaSenha');

  const onSubmitProfile = async (data) => {
    setLoading(true);
    try {
      const response = await userService.updateProfile(data);
      updateUser(response.user);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data) => {
    setLoading(true);
    try {
      await userService.updatePassword({
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha
      });
      toast.success('Senha atualizada com sucesso!');
      resetPassword();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar senha';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Meu Perfil</h1>
          <p className="page-subtitle">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="profile-container">
        {/* Sidebar com avatar e navegação */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <h3 className="profile-name">{user?.nome}</h3>
            <p className="profile-email">{user?.email}</p>
          </div>

          <nav className="profile-nav">
            <button
              className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              Dados Pessoais
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <Lock size={20} />
              Alterar Senha
            </button>
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Dados Pessoais</h2>
                <p className="section-subtitle">
                  Atualize suas informações pessoais
                </p>
              </div>

              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="profile-form">
                <div className="form-group">
                  <label htmlFor="nome" className="form-label">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    className={`form-input ${errorsProfile.nome ? 'form-input-error' : ''}`}
                    placeholder="Digite seu nome completo"
                    {...registerProfile('nome', {
                      required: 'Nome é obrigatório',
                      minLength: {
                        value: 2,
                        message: 'Nome deve ter pelo menos 2 caracteres'
                      }
                    })}
                  />
                  {errorsProfile.nome && (
                    <span className="form-error">{errorsProfile.nome.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`form-input ${errorsProfile.email ? 'form-input-error' : ''}`}
                    placeholder="Digite seu e-mail"
                    {...registerProfile('email', {
                      required: 'E-mail é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'E-mail inválido'
                      }
                    })}
                  />
                  {errorsProfile.email && (
                    <span className="form-error">{errorsProfile.email.message}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="btn-loading">
                        <div className="loading-spinner small"></div>
                        Salvando...
                      </div>
                    ) : (
                      <>
                        <Save size={20} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Alterar Senha</h2>
                <p className="section-subtitle">
                  Mantenha sua conta segura com uma senha forte
                </p>
              </div>

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="profile-form">
                <div className="form-group">
                  <label htmlFor="senhaAtual" className="form-label">
                    Senha atual *
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="senhaAtual"
                      className={`form-input ${errorsPassword.senhaAtual ? 'form-input-error' : ''}`}
                      placeholder="Digite sua senha atual"
                      {...registerPassword('senhaAtual', {
                        required: 'Senha atual é obrigatória'
                      })}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errorsPassword.senhaAtual && (
                    <span className="form-error">{errorsPassword.senhaAtual.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="novaSenha" className="form-label">
                    Nova senha *
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="novaSenha"
                      className={`form-input ${errorsPassword.novaSenha ? 'form-input-error' : ''}`}
                      placeholder="Digite sua nova senha"
                      {...registerPassword('novaSenha', {
                        required: 'Nova senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Nova senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errorsPassword.novaSenha && (
                    <span className="form-error">{errorsPassword.novaSenha.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmarNovaSenha" className="form-label">
                    Confirmar nova senha *
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmarNovaSenha"
                      className={`form-input ${errorsPassword.confirmarNovaSenha ? 'form-input-error' : ''}`}
                      placeholder="Confirme sua nova senha"
                      {...registerPassword('confirmarNovaSenha', {
                        required: 'Confirmação de senha é obrigatória',
                        validate: value => value === newPassword || 'Senhas não coincidem'
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
                  {errorsPassword.confirmarNovaSenha && (
                    <span className="form-error">{errorsPassword.confirmarNovaSenha.message}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="btn-loading">
                        <div className="loading-spinner small"></div>
                        Atualizando...
                      </div>
                    ) : (
                      <>
                        <Lock size={20} />
                        Atualizar Senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;