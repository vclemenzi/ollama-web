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

  const handleClick = async () => {
    if (!prompt) return;

    setChat([...chat, { author: "user", content: prompt }]);
    setLoading(true);
    setStream("");

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        "model": "llama2",
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
      <div className="md:flex md:items-center md:justify-center md:h-screen">
        <div className="md:w-[60%]">
          <div className="w-full min-h-[94vh] max-h-[94vh] md:min-h-[650px] md:max-h-[650px] overflow-auto mb-2 border-gray-400 md:border p-3 rounded-xl">
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
              className="md:rounded-l-md border-t md:border border-gray-400 p-2 focus:outline-none w-full"
              placeholder="Type something..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <button
              className="md:rounded-r-md p-2 bg-blue-500 text-white border-t md:border border-l-0 border-gray-400"
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
