# Online Hosting Platform

## Overview
This project is an online hosting platform that allows instructors to go live and teach students enrolled in their courses. It consists of a backend built with Node.js and Express, and a frontend developed using React.

## Project Structure
```
online-hosting-platform
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── socket
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── README.md
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── styles
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd online-hosting-platform
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   node src/server.js
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm start
   ```

### API Endpoints
Refer to the backend README for a list of available API endpoints and their usage.

### Components
- **VideoGrid**: Displays video streams for instructors and students.
- **Controls**: Provides controls for muting, toggling the camera, and ending the session.
- **HostSession**: Allows instructors to manage their live sessions.
- **StudentSession**: Enables students to join and view live sessions.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License.