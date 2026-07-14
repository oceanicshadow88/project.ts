import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JSONContent } from '@tiptap/core';
import { toast } from 'react-toastify';
import { IQuestion } from '../../../api/question/entity/question';
import { getQuestionsForPOReply } from '../../../api/question/question';
import { IReply } from '../../../api/reply/entity/reply';
import { createReply, updateReply, deleteReply } from '../../../api/reply/reply';
import { IUserInfo, IProjectRole, IRole } from '../../../types';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { UserContext } from '../../../context/UserInfoProvider';
import { getRoles } from '../../../api/role/role';
import POReplyQuestionItem from './components/POReplyQuestionItem/POReplyQuestionItem';

interface QuestionWithTicket extends IQuestion {
  ticket: {
    id: string;
    title: string;
    sprint?: {
      id: string;
      name: string;
      status?: 'active' | 'planning' | 'completed';
    } | null;
  };
  replies?: IReply[];
}

function POReplyPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const projectDetails = useContext(ProjectDetailsContext);
  const currentUser = useContext(UserContext);
  const [questions, setQuestions] = useState<QuestionWithTicket[]>([]);
  const [creatingReplyForQuestion, setCreatingReplyForQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const users: IUserInfo[] = projectDetails.users || [];

  // Check if user has Product Owner role
  useEffect(() => {
    const checkProductOwnerRole = async () => {
      // Wait for user to be loaded - check if user object exists and has id
      // Also check if projectsRoles is available (user data fully loaded)
      if (
        !currentUser ||
        Object.keys(currentUser).length === 0 ||
        !currentUser.id ||
        currentUser.projectsRoles === undefined
      ) {
        setIsAuthorized(null); // Still loading
        return;
      }

      if (!projectId) {
        setIsAuthorized(false);
        return;
      }

      try {
        // Check if user is project owner
        if (currentUser.isCurrentUserOwner) {
          setIsAuthorized(true);
          return;
        }

        // Get user's project roles - projectsRoles should be an array from UserInfoProvider
        const projectsRoles: IProjectRole[] = Array.isArray(currentUser.projectsRoles)
          ? currentUser.projectsRoles
          : [];

        // eslint-disable-next-line no-console
        console.log('POReplyPage auth check:', {
          hasUser: !!currentUser,
          userId: currentUser.id,
          projectsRolesCount: projectsRoles.length,
          projectsRoles,
          projectId
        });

        // If no project roles found, user is not authorized
        if (!projectsRoles || projectsRoles.length === 0) {
          setIsAuthorized(false);
          return;
        }

        // Find project role - handle both string and object project IDs
        const projectRole = projectsRoles.find((pr: IProjectRole) => {
          const prProject = pr.project as any;
          const prProjectId =
            typeof prProject === 'object' && prProject !== null
              ? prProject.id || prProject.toString()
              : String(prProject);
          return prProjectId === projectId;
        });

        if (!projectRole) {
          setIsAuthorized(false);
          return;
        }

        // Check if role is already populated with name/slug (from auto-fetch-userInfo)
        const role = projectRole.role as any;
        if (role && typeof role === 'object' && 'name' in role) {
          // Role is already populated
          const roleName = role.name as string;
          const roleSlug = role.slug as string;
          // eslint-disable-next-line no-console
          console.log('Checking role:', { roleName, roleSlug, projectId });
          if (roleName === 'Product Owner' || roleSlug === 'product-owner') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          // Role is not populated, fetch roles to check
          const roles = await getRoles(projectId);
          const roleObj = role as any;
          // eslint-disable-next-line no-underscore-dangle
          const roleIdValue = roleObj?._id;
          const roleId =
            typeof roleObj === 'object' && roleObj !== null && roleIdValue
              ? (roleIdValue as string)
              : (role as string);
          const userRole = roles.find((r: IRole) => r.id === roleId || r.id === String(roleId));

          if (
            userRole &&
            (userRole.name === 'Product Owner' || userRole.slug === 'product-owner')
          ) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (error) {
        setIsAuthorized(false);
      }
    };

    checkProductOwnerRole();
  }, [projectId, currentUser]);

  // Redirect if not authorized
  useEffect(() => {
    if (isAuthorized === false) {
      navigate('/unauthorize');
    }
  }, [isAuthorized, navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const result = await getQuestionsForPOReply(projectId);
        const questionsData = (result?.data || []) as QuestionWithTicket[];
        // Filter to only show questions awaiting PO response (waitingForStakeholder = true) and not resolved
        const poQuestions = questionsData.filter(
          (q) => q.waitingForStakeholder === true && !q.isResolved
        );
        // Sort by createdAt (oldest first)
        poQuestions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setQuestions(poQuestions);
      } catch (error) {
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCreateReply = async (questionId: string, content: JSONContent) => {
    try {
      const stringifiedContent = JSON.stringify(content);
      await createReply({
        question: questionId,
        content: stringifiedContent
      });
      setCreatingReplyForQuestion(null);
      toast.success('Reply sent successfully', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
      // Refresh questions to get updated replies
      if (projectId) {
        const result = await getQuestionsForPOReply(projectId);
        const questionsData = (result?.data || []) as QuestionWithTicket[];
        const poQuestions = questionsData.filter(
          (q) => q.waitingForStakeholder === true && !q.isResolved
        );
        poQuestions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setQuestions(poQuestions);
      }
    } catch (error) {
      setCreatingReplyForQuestion(null);
      toast.error('Failed to send reply. Please try again.', { theme: 'colored' });
    }
  };

  const handleUpdateReply = async (replyId: string, content: JSONContent) => {
    try {
      const stringifiedContent = JSON.stringify(content);
      await updateReply(replyId, { content: stringifiedContent });
      // Refresh questions to get updated replies
      if (projectId) {
        const result = await getQuestionsForPOReply(projectId);
        const questionsData = (result?.data || []) as QuestionWithTicket[];
        const poQuestions = questionsData.filter(
          (q) => q.waitingForStakeholder === true && !q.isResolved
        );
        poQuestions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setQuestions(poQuestions);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId);
      // Refresh questions to get updated replies
      if (projectId) {
        const result = await getQuestionsForPOReply(projectId);
        const questionsData = (result?.data || []) as QuestionWithTicket[];
        const poQuestions = questionsData.filter(
          (q) => q.waitingForStakeholder === true && !q.isResolved
        );
        poQuestions.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setQuestions(poQuestions);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Calculate statistics
  const urgentQuestionsCount = questions.filter(
    (q) => q.priority === 'Highest' || q.priority === 'High'
  ).length;

  // Count questions that need replies (no replies or last reply is not from current user)
  const needsReplyCount = currentUser?.id
    ? questions.filter((q) => {
        const replies = q.replies || [];
        const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
        const hasReplied = lastReply?.createdBy?.id === currentUser.id;
        const isNew = replies.length === 0;
        const needsReply = replies.length > 0 && !hasReplied;
        return isNew || needsReply;
      }).length
    : 0;

  // Count new questions (no replies)
  const newQuestionsCount = questions.filter((q) => {
    const replies = q.replies || [];
    return replies.length === 0;
  }).length;

  if (isAuthorized === null || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white border-b border-light shadow-sm">
          <div className="max-w-1100 mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="m-0 text-3xl font-semibold text-gray-dark">
                Questions Awaiting Your Response
              </h1>
            </div>
            <p className="m-0 text-gray text-sm">
              Please review and respond to the questions below
            </p>
          </div>
        </div>
        <div className="flex-1 max-w-1100 mx-auto w-full px-6 py-8">
          <div className="text-gray text-center py-12">
            <div className="text-lg mb-2">Loading questions...</div>
            <div className="text-sm">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-light shadow-sm p-5 fixed top-0 left-0 right-0 z-30">
        <div className="max-w-1100 mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="m-0 text-3xl font-semibold text-gray-dark">
              Questions Awaiting Your Response
            </h1>
          </div>
          <p className="m-0 text-gray text-sm mb-6">
            Please review and respond to the questions below
          </p>

          {/* Stats Cards */}
          {questions.length > 0 && (
            <div className="flex gap-4">
              {urgentQuestionsCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                  <span className="text-red-600 font-semibold text-lg">{urgentQuestionsCount}</span>
                  <span className="text-red-600 text-sm">Urgent</span>
                </div>
              )}
              {needsReplyCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-light border border-yellow rounded-md">
                  <span className="text-amber font-semibold text-lg">{needsReplyCount}</span>
                  <span className="text-amber text-sm">to reply</span>
                </div>
              )}
              {newQuestionsCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-light border border-primary rounded-md">
                  <span className="text-primary font-semibold text-lg">{newQuestionsCount}</span>
                  <span className="text-primary text-sm">new</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div
        className="flex-1 max-w-1100 mx-auto w-full px-6 pt-12 pb-8"
        style={{ marginTop: '200px' }}
      >
        {questions.length === 0 ? (
          <div className="bg-white border border-light rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-dark mb-2">No Questions Pending</h2>
            <p className="text-gray text-sm">All questions have been addressed. Great work! 🎉</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((question) => (
              <POReplyQuestionItem
                key={question.id}
                question={question}
                replies={question.replies || []}
                users={users}
                currentUserId={currentUser.id || ''}
                onCreateReply={handleCreateReply}
                onUpdateReply={handleUpdateReply}
                onDeleteReply={handleDeleteReply}
                creatingReplyForQuestion={creatingReplyForQuestion}
                setCreatingReplyForQuestion={setCreatingReplyForQuestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default POReplyPage;
