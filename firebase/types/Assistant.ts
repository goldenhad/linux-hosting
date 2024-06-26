
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

export enum AiModel {
    GPT4,
    VISION,
    GEMINI
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

export interface FileReference {
    name: string,
    nodes: Array<string>
}

export enum Visibility{
    PRIVATE,
    SELECTED,
    ALL
}

export default interface Assistant {
    name: string;
    image: string;
    category: string;
    description: string;
    video: string;
    uid: string;
    published: boolean;
    visibility: Visibility;
    selectedCompanies?: Array<string>;
    owner: string;
    blocks: Array<Block | InputBlock>;
    knowledgeFiles: Array<FileReference>;
    primaryColor?: string
}

export interface Block {
    prompt: string;
    personality: string;
    name: string,
    model: AiModel
}

export interface InputBlock extends Block {
    type: AssistantType;
    inputColumns: Array<AssistantInputColumn>;
    initialMessage?: string;
}