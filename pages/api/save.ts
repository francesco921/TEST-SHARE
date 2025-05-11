import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "Missing ID" });
  }

  const filePath = path.join(process.cwd(), "public", "quizzes", `${id}.json`);
  const data = JSON.stringify(req.body, null, 2);

  try {
    fs.writeFileSync(filePath, data);
    return res.status(200).json({ message: "Quiz saved", path: `/quizzes/${id}.json` });
  } catch (error) {
    console.error("Errore scrittura file:", error);
    return res.status(500).json({ message: "Errore nel salvataggio" });
  }
}
