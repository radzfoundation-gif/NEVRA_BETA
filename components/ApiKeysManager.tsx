import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { 
  Settings, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Save, 
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Code,
  Mic,
  Zap
} from 'lucide-react';
import { getUserApiKeys, saveUserApiKey, deleteUserApiKey, UserApiKey } from '@/lib/database';

type ProviderType = 'groq' | 'deepseek' | 'openai' | 'openai_image' | 'kimi';
type TaskType = 'image' | 'text' | 'code' | 'voice';

const PROVIDER_INFO: Record<ProviderType, { name: string; icon: string; description: string }> = {
  groq: { name: 'Groq (Llama 3)', icon: '⚡', description: 'Fast text generation' },
  deepseek: { name: 'DeepSeek V3', icon: '🧠', description: 'Advanced reasoning' },
  openai: { name: 'OpenAI (GPT-4o)', icon: '🤖', description: 'Text & code generation' },
  openai_image: { name: 'OpenAI (Vision)', icon: '🖼️', description: 'Image understanding' },
  kimi: { name: 'Kimi (Moonshot)', icon: '🌙', description: 'Chinese AI model' },
};

const TASK_TYPES: { type: TaskType; label: string; icon: React.ReactNode }[] = [
  { type: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
  { type: 'text', label: 'Text', icon: <FileText size={16} /> },
  { type: 'code', label: 'Code', icon: <Code size={16} /> },
  { type: 'voice', label: 'Voice', icon: <Mic size={16} /> },
];

interface ApiKeysManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeysManager: React.FC<ApiKeysManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const SUPABASE_TEMPLATE = import.meta.env.VITE_CLERK_SUPABASE_TEMPLATE || 'supabase';

  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<Partial<UserApiKey> | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadApiKeys();
    }
  }, [isOpen, user]);

  const loadApiKeys = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
      const keys = await getUserApiKeys(user.id, token);
      setApiKeys(keys);
    } catch (err) {
      console.error('Error loading API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !editingKey || !editingKey.provider || !editingKey.api_key_encrypted) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
      const autoRouteFor = editingKey.auto_route_for || [];
      const priority = editingKey.priority || 0;

      const success = await saveUserApiKey(
        user.id,
        editingKey.provider,
        editingKey.api_key_encrypted,
        autoRouteFor,
        priority,
        token
      );

      if (success) {
        setSuccess('API key saved successfully!');
        setEditingKey(null);
        await loadApiKeys();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save API key');
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: ProviderType) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete the ${PROVIDER_INFO[provider].name} API key?`)) return;

    try {
      const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
      const success = await deleteUserApiKey(user.id, provider, token);
      if (success) {
        setSuccess('API key deleted successfully!');
        await loadApiKeys();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete API key');
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key');
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (key?: UserApiKey) => {
    setEditingKey(key ? { ...key } : {
      provider: 'groq',
      api_key_encrypted: '',
      auto_route_for: [],
      priority: 0,
      is_active: true,
    });
    setError(null);
    setSuccess(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl mx-4 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Key className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">API Keys Management</h3>
              <p className="text-xs text-gray-400">Manage your API keys for unified access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-red-400" size={20} />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="text-green-400" size={20} />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* Add New Button */}
          {!editingKey && (
            <button
              onClick={() => startEditing()}
              className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 transition-all flex items-center justify-center gap-2 text-purple-300"
            >
              <Plus size={18} />
              <span>Add New API Key</span>
            </button>
          )}

          {/* Edit Form */}
          {editingKey && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">
                  {editingKey.id ? 'Edit' : 'Add'} API Key
                </h4>
                <button
                  onClick={() => setEditingKey(null)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  value={editingKey.provider || 'groq'}
                  onChange={(e) => setEditingKey({ ...editingKey, provider: e.target.value as ProviderType })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                    <option key={key} value={key} className="bg-[#0a0a0a]">
                      {info.icon} {info.name} - {info.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey[editingKey.id || 'new'] ? 'text' : 'password'}
                    value={editingKey.api_key_encrypted || ''}
                    onChange={(e) => setEditingKey({ ...editingKey, api_key_encrypted: e.target.value })}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    onClick={() => toggleShowKey(editingKey.id || 'new')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  >
                    {showKey[editingKey.id || 'new'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Auto-Route For */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Auto-Route For (Task Types)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_TYPES.map((task) => (
                    <label
                      key={task.type}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        editingKey.auto_route_for?.includes(task.type)
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editingKey.auto_route_for?.includes(task.type) || false}
                        onChange={(e) => {
                          const current = editingKey.auto_route_for || [];
                          if (e.target.checked) {
                            setEditingKey({ ...editingKey, auto_route_for: [...current, task.type] });
                          } else {
                            setEditingKey({ ...editingKey, auto_route_for: current.filter(t => t !== task.type) });
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex items-center gap-2 text-white">
                        {task.icon}
                        <span className="text-sm">{task.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select task types that should automatically use this API key
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority (Higher = Used First)
                </label>
                <input
                  type="number"
                  value={editingKey.priority || 0}
                  onChange={(e) => setEditingKey({ ...editingKey, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                  min="0"
                  max="100"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving || !editingKey.api_key_encrypted}
                className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save API Key</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* API Keys List */}
          {!editingKey && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Key className="mx-auto mb-2 opacity-50" size={32} />
                  <p>No API keys configured</p>
                  <p className="text-xs mt-1">Add your first API key to get started</p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{PROVIDER_INFO[key.provider].icon}</span>
                          <h4 className="text-white font-semibold">{PROVIDER_INFO[key.provider].name}</h4>
                          {key.priority > 0 && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                              Priority {key.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{PROVIDER_INFO[key.provider].description}</p>
                        
                        {/* Auto-Route Info */}
                        {key.auto_route_for.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="text-xs text-gray-500">Auto-route:</span>
                            {key.auto_route_for.map((task) => {
                              const taskInfo = TASK_TYPES.find(t => t.type === task);
                              return taskInfo ? (
                                <span
                                  key={task}
                                  className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded flex items-center gap-1"
                                >
                                  {taskInfo.icon}
                                  {taskInfo.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* API Key Preview */}
                        <div className="mt-3 flex items-center gap-2">
                          <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-400">
                            {showKey[key.id] 
                              ? key.api_key_encrypted 
                              : '•'.repeat(Math.min(key.api_key_encrypted.length, 20)) + '...'}
                          </code>
                          <button
                            onClick={() => toggleShowKey(key.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showKey[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEditing(key)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(key.provider)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#0a0a0a] to-transparent shrink-0">
          <p className="text-xs text-gray-500 text-center">
            💡 <strong>Tip:</strong> Set auto-route for specific task types. When you create images, the system will automatically use the API key configured for "Image" tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysManager;
