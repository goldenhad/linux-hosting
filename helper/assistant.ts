import { AssistantInputType, AssistantType, Block, InputBlock } from "../firebase/types/Assistant";

export const checkValidityOfAssistantConfig = (blocks: Array<Block | InputBlock>) => {
  let valid = false;

  if(blocks.length > 0){
    const inpBlock = blocks[0] as InputBlock;
    const isValidChat = inpBlock.type == AssistantType.CHAT;
    const isValidQaQ = inpBlock.type == AssistantType.QAA && inpBlock.inputColumns.length > 0 &&
            inpBlock.inputColumns.every((col) => {
              return col.title != undefined && col.inputs.every((inp) => {
                if(inp.type != undefined ){
                  if(inp.type == AssistantInputType.SELECT){
                    return inp.key != undefined && inp.name != undefined && inp.options.every((opt) => {
                      return opt.key != undefined && opt.value != undefined;
                    });
                  }else{
                    return inp.key != undefined && inp.name != undefined;
                  }
                }

                return false;
              })
            });

    valid = isValidQaQ || isValidChat
  }

  return valid;
}