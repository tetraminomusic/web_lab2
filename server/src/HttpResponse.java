import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class HttpResponse {

    // Используем CRLF (\r\n) везде, это критически важно для FastCGI
    private static final String CRLF = "\r\n";

    public static void sendSystemError(String message) throws IOException {
        String jsonError = String.format("{\"error\":\"Критический сбой сервера: %s\"}", message.replace("\"", "\\\""));
        byte[] bytes = jsonError.getBytes(StandardCharsets.UTF_8);

        String response = "Status: 500 Internal Server Error" + CRLF +
                "Content-Type: application/json; charset=utf-8" + CRLF +
                "Content-Length: " + bytes.length + CRLF +
                CRLF +
                jsonError;
        System.out.print(response);
        System.out.flush();
    }

    public static void sendJson(String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        String response = "Status: 200 OK" + CRLF +
                "Content-Type: application/json; charset=utf-8" + CRLF +
                "Content-Length: " + bytes.length + CRLF +
                CRLF +
                json;
        System.out.print(response);
        System.out.flush();
    }

    public static void sendError(String message) throws IOException {
        String jsonError = String.format("{\"error\":\"%s\"}", message.replace("\"", "\\\""));
        byte[] bytes = jsonError.getBytes(StandardCharsets.UTF_8);

        String response = "Status: 400 Bad Request" + CRLF +
                "Content-Type: application/json; charset=utf-8" + CRLF +
                "Content-Length: " + bytes.length + CRLF +
                CRLF +
                jsonError;

        System.out.print(response);
        System.out.flush();
    }
}