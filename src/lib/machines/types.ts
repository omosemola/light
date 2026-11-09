/**
 * Universal State Machine Definitions & Contracts
 * Powers explicit, type-safe lifecycle flows across Lightson Marketplace.
 */

export interface MachineTransition<TState extends string, TEvent extends string> {
  from: TState;
  to: TState;
  event: TEvent;
  guard?: () => boolean;
  action?: () => void | Promise<void>;
}

export interface TransitionResult<TState extends string> {
  success: boolean;
  from: TState;
  to: TState;
  error?: string;
}

export type StateDescriptor<TState extends string> = {
  id: TState;
  label: string;
  description: string;
  isTerminal?: boolean;
};

