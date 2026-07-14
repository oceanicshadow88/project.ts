import React, { useEffect, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { IPrompt, UpdatePrompt } from '../../api/prompt/entity/prompt';
import { getPrompts, createPrompt, updatePrompt, deletePrompt } from '../../api/prompt/prompt';
import { UserContext } from '../../context/UserInfoProvider';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import ButtonV2 from '../../lib/FormV2/ButtonV2/ButtonV2';
import InputV2 from '../../lib/FormV2/InputV2/InputV2';
import TextAreaV2 from '../../lib/FormV2/TextAreaV2/TextAreaV2';
import Modal from '../../lib/Modal/Modal';
import TimeAgo from '../../components/TimeAgo/TimeAgo';

interface PromptFormData {
  title: string;
  prompt: string;
}

function PromptsPage() {
  const currentUser = useContext(UserContext);
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<PromptFormData>({ title: '', prompt: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      const result = await getPrompts();
      // Handle paginated response structure
      const promptsData = result?.data?.data || [];

      // DEBUG: Log the data to see what we're getting
      // eslint-disable-next-line no-console
      console.log('🔍 DEBUG - Current user:', currentUser);
      // eslint-disable-next-line no-console
      console.log('🔍 DEBUG - Raw result:', result);
      // eslint-disable-next-line no-console
      console.log('🔍 DEBUG - Prompts data:', promptsData);

      // Sort by createdAt (newest first)
      promptsData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setPrompts(promptsData);
    } catch (error) {
      toast.error('Failed to fetch prompts');
      setPrompts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const openModal = (mode: 'create' | 'edit' | 'view', prompt?: IPrompt) => {
    setModalMode(mode);
    setSelectedPrompt(prompt || null);

    if (mode === 'create') {
      setFormData({ title: '', prompt: '' });
    } else if (prompt) {
      setFormData({ title: prompt.title, prompt: prompt.prompt });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
    setFormData({ title: '', prompt: '' });
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.prompt.trim()) {
      toast.error('Title and prompt are required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        await createPrompt({
          title: formData.title.trim(),
          prompt: formData.prompt.trim()
        });
        toast.success('Prompt created successfully');
      } else if (modalMode === 'edit' && selectedPrompt) {
        const updateData: UpdatePrompt = {};
        if (formData.title !== selectedPrompt.title) {
          updateData.title = formData.title.trim();
        }
        if (formData.prompt !== selectedPrompt.prompt) {
          updateData.prompt = formData.prompt.trim();
        }

        if (Object.keys(updateData).length > 0) {
          // eslint-disable-next-line no-underscore-dangle
          await updatePrompt(selectedPrompt.id, updateData);
          toast.success('Prompt updated successfully');
        }
      }

      await fetchPrompts();
      closeModal();
    } catch (error) {
      toast.error(`Failed to ${modalMode} prompt`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prompt: IPrompt) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Are you sure you want to delete "${prompt.title}"?`);
    if (!confirmed) return;

    try {
      // eslint-disable-next-line no-underscore-dangle
      await deletePrompt(prompt.id);
      toast.success('Prompt deleted successfully');
      await fetchPrompts();
    } catch (error) {
      toast.error('Failed to delete prompt');
    }
  };

  const handleInputChange = (field: keyof PromptFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    const isViewMode = modalMode === 'view';
    let title = 'Create New Prompt';
    if (modalMode === 'edit') {
      title = 'Edit Prompt';
    } else if (modalMode === 'view') {
      title = 'View Prompt';
    }

    return (
      <Modal classesName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="mb-4">
                <InputV2
                  name="title"
                  label="Title"
                  value={formData.title}
                  onValueChanged={(e) => handleInputChange('title', e.target.value)}
                  placeHolder="Enter prompt title"
                  required
                  dataTestId="prompt-title-input"
                />
              </div>

              <div className="mb-4">
                <TextAreaV2
                  name="prompt"
                  label="Prompt"
                  defaultValue={formData.prompt}
                  onValueChanged={(e) => handleInputChange('prompt', e.target.value)}
                  placeHolder="Enter your prompt here..."
                  required
                  dataTestId="prompt-content-input"
                />
              </div>

              {isViewMode && selectedPrompt && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="mb-2">
                    <strong>Created by:</strong> {selectedPrompt.createdBy?.name || 'Unknown'}
                  </p>
                  <p className="mb-2">
                    <strong>Created:</strong> <TimeAgo date={selectedPrompt.createdAt} />
                  </p>
                  <p>
                    <strong>Updated:</strong> <TimeAgo date={selectedPrompt.updatedAt} />
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 border-t">
              {!isViewMode && (
                <ButtonV2
                  btnType="submit"
                  text={modalMode === 'create' ? 'Create' : 'Update'}
                  onClick={() => {}}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              )}
              <ButtonV2
                btnType="button"
                text={isViewMode ? 'Close' : 'Cancel'}
                onClick={closeModal}
              />
            </div>
          </form>
        </div>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="text-center text-gray-600">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <SectionTitle>Prompts</SectionTitle>
        <ButtonV2 text="Create Prompt" fill onClick={() => openModal('create')} />
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <h3>No prompts yet</h3>
          <p>Create your first prompt to get started.</p>
          <ButtonV2 text="Create Your First Prompt" onClick={() => openModal('create')} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <div
              // eslint-disable-next-line no-underscore-dangle
              key={prompt.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{prompt.title}</h3>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    className="bg-blue-100 border-none text-blue-600 cursor-pointer px-2 py-1 rounded transition-all hover:bg-blue-200"
                    onClick={() => openModal('view', prompt)}
                    title="View prompt"
                  >
                    View
                  </button>
                  {currentUser?.id &&
                    prompt?.createdBy?.id &&
                    currentUser.id === prompt.createdBy.id && (
                      <>
                        <button
                          type="button"
                          className="bg-yellow-100 border-none text-yellow-700 cursor-pointer px-2 py-1 rounded transition-all hover:bg-yellow-200 ml-1"
                          onClick={() => openModal('edit', prompt)}
                          title="Edit prompt"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="bg-red-100 border-none text-red-600 cursor-pointer px-2 py-1 rounded transition-all hover:bg-red-200 ml-1"
                          onClick={() => handleDelete(prompt)}
                          title="Delete prompt"
                        >
                          Delete
                        </button>
                      </>
                    )}
                </div>
              </div>

              <div className="text-gray-600 mb-3 text-sm leading-relaxed">
                {prompt.prompt.length > 150
                  ? `${prompt.prompt.substring(0, 150)}...`
                  : prompt.prompt}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By {prompt.createdBy?.name || 'Unknown'}</span>
                <span>
                  <TimeAgo date={prompt.createdAt} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderModal()}
    </div>
  );
}

export default PromptsPage;
