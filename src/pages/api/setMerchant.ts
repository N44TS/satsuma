import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { address } = req.body;
    const filePath = path.join(process.cwd(), 'merchantAddress.txt');
    try {
      fs.writeFileSync(filePath, address);
      console.log('Merchant address saved:', address);
      res.status(200).json({ message: 'Merchant address saved' });
    } catch (error) {
      console.error('Error saving merchant address:', error);
      res.status(500).json({ message: 'Failed to save merchant address' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}