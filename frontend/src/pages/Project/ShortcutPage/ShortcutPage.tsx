/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { AiOutlineLink } from 'react-icons/ai';
import { IoIosAdd } from 'react-icons/io';
import { useParams } from 'react-router-dom';
import { IProjectData, IShortcutData } from '../../../types';
import checkAccess from '../../../utils/helpers';
import addshorcut from '../../../assets/addshorcut.svg';
import { ProjectContext, ProjectDispatchContext } from '../../../context/ProjectProvider';
import { deleteShortcut } from '../../../api/shortcut/shortcut';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import InputV2 from '../../../lib/FormV2/InputV2/InputV2';
import Modal from '../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import ShortcutModal from '../../../components/Modals/ShortcutModal/ShortcutModal';
import { Permission } from '../../../utils/permission';

export default function ShortcutPage() {
  const { projectId = '' } = useParams();

  const [openModal, setOpenModal] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const projects = useContext(ProjectContext);
  const fetchProjects = useContext(ProjectDispatchContext);
  const [shortcuts, setShortcuts] = useState<any>([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    const result: IProjectData = projects.filter((item) => item.id === projectId)[0];
    setShortcuts(result.shortcut);
  }, [projects]);

  const removeShortCut = (shortcutId: string) => {
    deleteShortcut(projectId, shortcutId).then(() => {
      setShortcuts(shortcuts.filter((item) => item.id !== shortcutId));
      fetchProjects();
    });
  };

  const renderModals = () => {
    return (
      <div>
        {openModal &&
          ReactDOM.createPortal(
            <Modal classesName="clear max-w-500 overflow-visible">
              <div className="relative mt-0 z-0">
                <img
                  src={addshorcut}
                  alt="shortcut"
                  className="max-w-100 absolute left-0 right-0 mx-auto z-0 opacity-25"
                />
              </div>
              <div className="relative z-10">
                <DefaultModalHeader
                  title="Shortcut"
                  onClickClose={() => {
                    setOpenModal(false);
                  }}
                />
                <ShortcutModal
                  operation={selectedData ? 'Edit' : 'Add'}
                  setAddLinkToggle={setOpenModal}
                  addLinkToggle={openModal}
                  selectedLink={selectedData}
                  currentProjectId={projectId}
                  shortCutAdded={() => {
                    setOpenModal(false);
                    fetchProjects();
                  }}
                  shortCutUpdated={fetchProjects}
                />
              </div>
            </Modal>,
            document.body
          )}
      </div>
    );
  };

  const renderShortcutList = () => {
    const filteredShortcuts = searchInput
      ? shortcuts.filter((item) => item.name.includes(searchInput))
      : shortcuts;

    return (
      <div className="my-5 mx-12 flex flex-wrap gap-5">
        {filteredShortcuts.map((shortcutData: IShortcutData) => {
          return (
            <div
              key={shortcutData.id}
              className="w-full p-5 border-3 border-light rounded-lg my-5 text-gray hover-shadow-md transition-all shortcut-item"
              data-testid={`item-${shortcutData.id}`}
            >
              <a
                href={
                  shortcutData.shortcutLink && shortcutData.shortcutLink.includes('https://')
                    ? shortcutData.shortcutLink
                    : `https://${shortcutData.shortcutLink}`
                }
                target="_blank"
                rel="noreferrer"
                data-testid={`shortcut-${shortcutData.id}`}
                className="no-underline text-gray visited:text-gray flex items-center gap-3"
              >
                <AiOutlineLink className="text-2xl" />
                <span className="text-xl flex-1">{shortcutData.name}</span>
              </a>
              <div className="mt-5 flex gap-4">
                {checkAccess(Permission.EditShortcut, projectId) && (
                  <ButtonV2
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenModal(!openModal);
                      setSelectedData(shortcutData);
                    }}
                    text="Edit"
                    size="button-xs"
                    dataTestId={`edit-shortcut-${shortcutData.id}`}
                  />
                )}
                {checkAccess(Permission.DeleteShortcut, projectId) && (
                  <ButtonV2
                    onClick={(e) => {
                      e.preventDefault();
                      if (!shortcutData.id) {
                        return;
                      }
                      removeShortCut(shortcutData.id);
                    }}
                    text="Delete"
                    size="button-xs"
                    danger
                    dataTestId={`delete-shortcut-${shortcutData.id}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTip = () => {
    return (
      <p className="my-5 mx-12 font-black text-base text-gray">
        Tips: Consider bookmark your links into chrome.
      </p>
    );
  };

  const renderSubMenu = () => {
    return (
      <div className="mx-12 flex justify-between items-center gap-4">
        <InputV2
          label="Search"
          onValueChanged={(e) => {
            setSearchInput(e.target.value);
          }}
          defaultValue=""
          name="search"
          classes="max-w-400 border-3 border-light"
          dataTestId="search"
        />
        <div>
          {checkAccess(Permission.CreateShortcuts, projectId) && (
            <ButtonV2
              text="ADD LINK"
              onClick={() => {
                setOpenModal(true);
                setSelectedData(null);
              }}
              icon={<IoIosAdd className="w-5 h-5" />}
              fill
              dataTestId="add-link"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <ProjectHOC title="Shortcut">
      {renderSubMenu()}
      {renderTip()}
      {renderShortcutList()}
      {renderModals()}
    </ProjectHOC>
  );
}
