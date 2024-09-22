import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const filePath = path.join(process.cwd(), 'merchantAddress.txt');
    if (fs.existsSync(filePath)) {
      const address = fs.readFileSync(filePath, 'utf8');
      res.status(200).json({ address });
    } else {
      res.status(404).json({ message: 'Merchant address not set' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}