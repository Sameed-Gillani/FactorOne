const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀  FactorOne API running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`📍  Base URL : http://localhost:${PORT}/api`);
      console.log(`❤️   Health   : http://localhost:${PORT}/api/health\n`);
    });

    const shutdown = (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully…`);
      server.close(() => {
        console.log('✅  HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥  Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('❌  Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();