import sys
import json
from typing import List, Optional
from llama import Dialog, Llama


def main():
    ckpt_dir='/media/bg-labs/usb/go-db-llm/backend/genai/Meta-Llama-3-8B-Instruct'
    tok_path='/media/bg-labs/usb/go-db-llm/backend/genai/Meta-Llama-3-8B-Instruct/tokenizer.model'
    max_seq_len=512
    max_batch_size=6
    max_gen_len: Optional[int] = None
    temp=0.6
    top_p=0.9


    generator = Llama.build(
        ckpt_dir=ckpt_dir,
        tokenizer_path=tok_path,
        max_seq_len=max_seq_len,
        max_batch_size=max_batch_size,
    )

    print("Successful Loading of Model")

    #example of prompt to send
    #dialogs: List[Dialog] = [
    #    [{"role": "user", "content": "remove all words and symbols that are not a units or amounts make sure to include units and their measure that have spaces between them. Data like cookies or ribs count as a unit. Don't reply with any extra information"
    #   "For example [1, 1/2 Cup(aprx. 8ml) 243g] you should respond [1, 1/2Cup 8ml 243g]"
    #    " data: [345, )(appprox 27ml) 2C], [6454, copkie], [2584, coookie], [755, tbsp mix (25g)makes 1 cookie] [6303, fl.oz . as prepared) | ( (45.0 ml) aprx]"},
    #    ]
    #     ]

    cin = input()
    while cin != "{'prompt': 'Exit'}":

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
                print(f"{result['generation']['content']}")

        dialogs: List[Dialog] = []
        

        if sys.stdin.isatty():
            print("End Output")
            
        cin = input()

    quit()

if __name__ == "__main__":
    main()