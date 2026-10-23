
export default async function handler(request) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Chỉ hỗ trợ POST" },
      { status: 405 }
    );
  }

  try {
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    const model =
      Netlify.env.get("GEMINI_MODEL") ||
      "gemini-3.5-flash-lite";

    if (!apiKey) {
      return Response.json(
        { error: "Chưa cấu hình GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const question = body.question;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 10000
    ) {
      return Response.json(
        { error: "Câu hỏi không hợp lệ" },
        { status: 400 }
      );
    }

    const prompt = `
Bạn là gia sư AI của website XSTK Learner.

Nhiệm vụ:
- Giải thích kiến thức dễ hiểu bằng tiếng Việt.
- Hướng dẫn giải toán từng bước.
- Giải thích rõ công thức và ký hiệu.
- Sử dụng LaTeX cho biểu thức toán học.
- Không tự ý bỏ qua bước tính.
- Nếu đề bài thiếu dữ liệu, hãy nói rõ.
- Khuyến khích người học tự hiểu cách giải.

Câu hỏi của học sinh:
${question}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API:", data);
      return Response.json(
        { error: "Không thể gọi Gemini. Kiểm tra model, API key hoặc hạn mức." },
        { status: 502 }
      );
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.filter(part => part.text)
        .map(part => part.text)
        .join("\n") || "AI chưa tạo được câu trả lời.";

    return Response.json({ answer });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Lỗi xử lý yêu cầu AI" },
      { status: 500 }
    );
  }
}

