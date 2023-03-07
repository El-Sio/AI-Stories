export interface Choice {
  text: string;
  index: number;
  logprobs: any;
  finish_reason: string;
}

export interface ChatChoice {
  message: Message;
  index: number;
  finish_reason: string;
}

export interface ImageAI {
  created: number;
  data: [
    {
      b64_json: string;
    }
  ];
}

export interface ModelList {
  data: Model[];
}

export interface speechTiming {
  time:number;
  type:string;
  start:number;
  end:number;
  value:string;
}

export interface completeStory {
  location: string;
  purpose: string;
  companion: string;
  text: string;
  image: string;
  audio: string;
  speechMarks: string;
}

export interface Model {
  id: string;
  object: string;
  owned_by: string;
  permission: any;
}

export interface Message {
  role: string;
  content: string;
}

export interface FineTuneResponse {
  object: string;
  data: FineTune[];
}

export interface FTEvents {
  object: string;
  created_at: number;
  level: string;
  message: string;
}

export interface FineTune {
  id: string;
  object: string;
  model: string;
  created_at: number;
  fine_tuned_model: string;
  hyperparams: any;
  organization_id: string;
  result_files: any;
  status: string;
  validation_files: any;
  training_files: any;
  updated_at: number;
  events: FTEvents[];
}

export interface FilreResponse {
  object: string;
  data: TrainingFiles[];
}

export interface TrainingFiles {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface TraningData {
  prompt: string;
  completion: string;
}

export interface Completion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface User {
  user: string;
  password: string;
}

export interface Authent {
  user: string;
  password: string;
  access: Boolean;
  isAdmin: Boolean;
  hasViz: Boolean;
  message: string;
  aws: string;
}
