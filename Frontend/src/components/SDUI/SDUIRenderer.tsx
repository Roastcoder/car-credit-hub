import React from 'react';
import { SDUIRegistry } from './registry';
import { SDUIComponentProps, SDUIRendererProps } from './types';

export const SDUIRenderer: React.FC<SDUIRendererProps> = ({ config, context = {} }) => {
  if (!config) return null;

  // Resolve the component from the registry based on type
  const Component = SDUIRegistry[config.type];

  if (!Component) {
    console.warn(`[SDUI] Component type "${config.type}" not found in registry.`);
    return <div className="p-4 border border-red-500 bg-red-50 text-red-700 text-sm">Unknown Component: {config.type}</div>;
  }

  // Handle children recursively
  const renderChildren = () => {
    if (!config.children) return null;
    
    // If children is a raw string
    if (typeof config.children === 'string') {
      return config.children;
    }

    // If children is an array of SDUI component configs
    if (Array.isArray(config.children)) {
      return config.children.map((child, index) => (
        <SDUIRenderer 
          key={child.id || `sdui-child-${index}`} 
          config={child} 
          context={context} 
        />
      ));
    }

    return null;
  };

  // Render the component and pass props + recursive children + data context
  return (
    <Component {...config.props} context={context}>
      {renderChildren()}
    </Component>
  );
};
