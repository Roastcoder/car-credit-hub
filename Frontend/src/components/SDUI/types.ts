export type SDUIComponentProps = {
  id?: string;
  type: string;
  props?: Record<string, any>;
  children?: SDUIComponentProps[] | string;
};

export interface SDUIRendererProps {
  config: SDUIComponentProps;
  context?: Record<string, any>; // Used to pass dynamic data (e.g. loans, user info)
}
