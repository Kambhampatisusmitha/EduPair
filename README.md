# EduPeer - Deployment Guide

This guide explains how to deploy the EduPeer application on Render.

## Project Overview

EduPeer is a full-stack application with:
- Frontend: React with Vite
- Backend: Express.js
- Database: Neon PostgreSQL

## Deployment Steps on Render

### 1. Create a New Web Service

1. Sign in to your [Render account](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or upload your code directly

### 2. Configure the Web Service

Use the following settings:
- **Name**: EduPeer (or your preferred name)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Set Environment Variables

Add the following environment variables:
- `NODE_ENV`: production
- `PORT`: 10000 (or let Render assign one)
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `CORS_ORIGIN`: Your deployed app URL (e.g., https://edupeer.onrender.com)

### 4. Deploy

Click "Create Web Service" and Render will begin the deployment process.

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the necessary environment variables
4. Run the development server: `npm run dev`

## Project Structure

- `/client`: Frontend React application
- `/server`: Backend Express.js server
- `/shared`: Shared code between frontend and backend
- `/dist`: Build output directory (created during build)

## Database

This project uses Neon PostgreSQL. Make sure your database is properly configured and accessible from Render.

## Troubleshooting

If you encounter issues during deployment:
1. Check the Render logs for error messages
2. Verify all environment variables are correctly set
3. Ensure your database is accessible from Render
4. Check if your build and start commands are working correctly
