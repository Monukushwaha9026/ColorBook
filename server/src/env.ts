import path from 'path';
import dotenv from 'dotenv';

// Guarantee .env is parsed and present in process.env before any other module imports execute
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
