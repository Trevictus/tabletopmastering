/**
 * @fileoverview Contexto de Grupos (Wrapper sobre Zustand)
 * @description Provee compatibilidad con componentes existentes que usan useGroup
 * @module context/GroupContext
 */

import PropTypes from 'prop-types';
import { createContext } from 'react';
import useGroupStore from '../stores/groupStore';

const GroupContext = createContext(null);

/**
 * Custom hook to access group context
 * Acts as wrapper over Zustand store for compatibility
 * @returns {Object} Group context
 */
export const useGroup = () => {
  // Use Zustand store directly
  const selectedGroup = useGroupStore((state) => state.selectedGroup);
  const groups = useGroupStore((state) => state.groups);
  const loading = useGroupStore((state) => state.loading);
  const error = useGroupStore((state) => state.error);
  const selectGroup = useGroupStore((state) => state.selectGroup);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const clearError = useGroupStore((state) => state.clearError);
  
  return {
    selectedGroup,
    groups,
    loading,
    error,
    selectGroup,
    loadGroups,
    clearError,
  };
};

/**
 * Group context provider
 * Maintains compatibility with the previous system
 */
export const GroupProvider = ({ children }) => {
  // The context value is just a marker to verify the provider
  return (
    <GroupContext.Provider value={true}>
      {children}
    </GroupContext.Provider>
  );
};

GroupProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default GroupContext;
