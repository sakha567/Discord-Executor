local WS_URL     = "ws://localhost:8080"
local SECRET_KEY = "_secret_key_" //your Secret Key. (Must same in index.js)

local HttpService = game:GetService("HttpService")
local ws = WebSocket.connect(WS_URL)

ws:Send(HttpService:JSONEncode({
    type   = "auth",
    secret = SECRET_KEY,
}))

ws.OnMessage:Connect(function(message)
    local data = HttpService:JSONDecode(message)

    if data.type == "print" then
        print(data.content)
    elseif data.type == "execute" then
        loadstring(data.code)()
    end
end)