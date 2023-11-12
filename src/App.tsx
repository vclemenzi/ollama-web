import { useState } from "react";

interface Message {
  author: "bot" | "user";
  content: string;
}

function App() {
  const [prompt, setPrompt] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stream, setStream] = useState<string>("");
  const [model, setModel] = useState<string>("llama2");

  const handleClick = async () => {
    if (!prompt) return;

    setChat([...chat, { author: "user", content: prompt }]);
    setLoading(true);
    setStream("");

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        "model": model || "llama2",
        "prompt": prompt,
      }),
    });

    const body = res.body;
    const reader = body.getReader();
    const textDecoder = new TextDecoder('utf-8');

    let response = "";

    while (true) {
      const { done, value } = await reader.read();
      const data: { response: string, done: boolean } = JSON.parse(textDecoder.decode(value).toString());

      if (data.done || done) {
        break;
      } else {
        response += data.response;

        setStream(response);
      }
    }

    setLoading(false);
    setChat(oldChat => [...oldChat, { author: "bot", content: response }]);
    setPrompt("");

    reader.releaseLock();
  };

  return (
    <>
      <div>
        <div className="max-h-screen min-h-screen h-screen w-screen p-3">
          {/* Navbar */}
          <div className="flex p-3 items-center justify-between border-b border-gray-400 mb-2">
            <div className="flex items-center">
              <img src="/ollama.png" className="2-10 h-10 mr-2" />
              <h1 className="font-bold select-none">Ollama Web</h1>
            </div>
            <div className="text-center">
              <select className="text-right bg-transparent ml-2 cursor-pointer appearance-none hover:underline" onChange={(e) => setModel(e.target.value)}>
                <option value="llama2" defaultChecked>llama2</option>
                <option value="mistral">mistral</option>
                <option value="codellama">codellama</option>
                <option value="llama2-uncensored">llama2-uncensored</option>
                <option value="orca-mini">orca-mini</option>
              </select>
            </div>
          </div>

          {/* Chat */}
          <div className="w-full h-5/6 overflow-auto mb-2 -3">
            {/* Messages */}
            {chat.map((msg, i) => {
              if (msg.author === "bot") {
                return <div key={i} className="flex justify-start mb-5">
                  <div className="border-gray-400 border rounded-xl p-2 max-w-[70%]">
                    {msg.content}
                  </div>
                </div>
              } else {
                return <div key={i} className="flex justify-end mb-5">
                  <div className="text-right bg-blue-300 border-gray-400 border rounded-xl p-2 max-w-[70%]">
                    {msg.content}
                  </div>
                </div>
              }
            })}

            {
              loading ? <div className="flex justify-start mb-5">
                <div className="border-gray-400 border rounded-xl p-2 max-w-[70%] mb-5">
                  {stream ? stream : "..."}
                </div>
              </div> : <></>
            }
          </div>

          <div className="flex w-full">
            <input
              className="rounded-l-md  border border-gray-400 p-2 focus:outline-none w-full"
              placeholder="Type something..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <button
              className="rounded-r-md p-2 bg-blue-500 text-white border-t border border-l-0 border-gray-400"
              onClick={handleClick}
            >
              {
                loading ? <div>...</div> : <div>Send</div>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App;
