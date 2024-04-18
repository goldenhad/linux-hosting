
export enum AssistantType {
    "QAA",
    "CHAT",
    "PIPELINE"
}

export enum AssistantInputType {
    PROFILE,
    TEXT_INPUT,
    TEXT_AREA,
    SELECT,
}

export interface GenericInput {
    key: string;
    placeholder: string;
}

export interface AssistantOption {
    key: string;
    value: string;
}

export interface AssistantInput {
    type: AssistantInputType;
    key: string;
    name: string;
    placeholder?: string;
    multiple?: boolean;
    maxSelected?: number;
    options?: Array<AssistantOption>;
}

export interface AssistantInputColumn {
    title: string;
    inputs: Array<AssistantInput>;
}

export default interface Assistant {
    name: string;
    image: string;
    category: string;
    description: string;
    video: string;
    uid: string;
    published: boolean;
    blocks: Array<Block | MultiStepBlock>;
}

export interface Block {
    prompt: string;
    personality: string;
}

export interface MultiStepBlock extends Block {
    type: AssistantType;
    inputColumns: Array<AssistantInputColumn>;
    initialMessage: string;
}