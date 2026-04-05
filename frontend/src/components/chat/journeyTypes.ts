export type BrowserStep = { order: number; description: string; state: string };

export type BrowserAction = { id: string; label: string; url: string };

export type BrowserSession = {
  id: string;
  mode: string;
  status: string;
  task: string;
  steps: BrowserStep[];
  actions: BrowserAction[];
  note?: string;
  priceCheckItems?: string[];
};

export type CloudSessionView = {
  id: string;
  status: string;
  liveUrl: string | null;
  lastStepSummary: string | null;
  stepCount: number;
  output: unknown;
  isTaskSuccessful: boolean | null;
};
