import 'dotenv/config'; // Modern way to load .env with ES Modules
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AssetFlow Backend server is running on http://localhost:${PORT}`);
});