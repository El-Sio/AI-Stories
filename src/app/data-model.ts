export interface Choice {
  text: string;
  index: number;
  logprobs: any;
  finish_reason: string;
}

export interface ImageAI {
  created: number;
  data: [
    {
      url: string;
    }
  ];
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
}
