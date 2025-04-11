import sys
import json
from typing import List, Optional
from llama import Dialog, Llama
import torch
import torch.distributed as dist


def main():
    ckpt_dir='/media/bg-labs/usb/go-db-llm/backend/genai/Meta-Llama-3-8B-Instruct'
    tok_path='/media/bg-labs/usb/go-db-llm/backend/genai/Meta-Llama-3-8B-Instruct/tokenizer.model'
    max_seq_len=512
    max_batch_size=6
    max_gen_len: Optional[int] = None
    temp=0.6
    top_p=0.9



    if torch.cuda.is_available():
        torch.set_default_device("cuda")
    else:
        torch.set_default_device("cpu")

    torch.set_default_dtype(torch.float32)

    generator = Llama.build(
        ckpt_dir=ckpt_dir,
        tokenizer_path=tok_path,
        max_seq_len=max_seq_len,
        max_batch_size=max_batch_size,
    )

    print("Successful Loading of Model")

    cin = input()
    while cin != "{\"prompt\":\"Exit\"}":

        data = json.loads(cin)

        dialogs: List[Dialog] = [[data]]

        results = generator.chat_completion(
            dialogs,
            max_gen_len=max_gen_len,
            temperature=temp,
            top_p=top_p
        )

        for dialog, result in zip(dialogs, results):
            for msg in dialog:
                #print(f"{msg['role']}: {msg['content']}\n")
                print(f"{result['generation']['content']}")
              

        dialogs: List[Dialog] = []

        cin = input()

    dist.destroy_process_group()
    print("Model Unloaded")
    quit()

if __name__ == "__main__":
    main()