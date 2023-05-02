## Nightingale

<img src="https://i.imgur.com/FK16UuB.png" alt="Screenshot of Nightingale. Shown on top is the mini player with an audio visualizer underneath in the background. The mini player has the following title: Nightingale PLAYING Buckethead - Pepper's Ghost - Imprint (Dedicated to Takashi Miike)">

A music streaming server like no other.

## Tech Stack

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/database-postgresql-f6c819?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=21223e)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Babel](https://img.shields.io/badge/Babel-F9DC3e?style=for-the-badge&logo=babel&logoColor=black)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

## Overview

Nightingale is an open-source music streaming server designed to provide a unique, synchronized listening experience across multiple devices, as well as enabling users to share their music with others. The server maintains the current song and progress, ensuring that all clients connecting to it are synced up at the same point in the song. This allows users to enjoy their personal music library wherever they have an internet connection, offering a seamless transition between devices and a shared listening experience with friends and family.

Built using a modern tech stack, Nightingale features Express.js, TypeScript, React, Redux, PostgreSQL, JavaScript, TailwindCSS, Docker, Babel, and SQLite. The installation process assumes you have FFmpeg, Postgres database, and Node.js/npm already set up, and it provides instructions for setting up SSL locally if desired. I will provide a docker-compose file as soon as I finish up containerizing the project.

With Nightingale, you never have to worry about interrupting your favorite song when switching between devices or sharing your music with others. Enjoy a continuous, synchronized, and communal music experience that follows you wherever you go.

## Features

Nightingale offers a wide range of features designed to enhance your music streaming experience:

- Synchronized playback across multiple devices for a seamless listening experience
- Music sharing with friends and family to enjoy a communal listening experience
- Modern and responsive user interface built with React and TailwindCSS
- Scalable and efficient backend powered by Express.js, TypeScript, and PostgreSQL
- Easy deployment with Docker and Docker Compose

## Installation

### Via Docker

<ol>
  <li>Prerequisites
    <p>
      This method uses (externally)
      <ul>
        <li>Docker</li>
        <li>Docker Compose</li>
      </ul>
    </p>
  </li>
  <li>Copy the provided compose.yaml and edit to your hearts content, but don't forget:
    <ul>
      <li>Replace /path/to/keysAndCerts with the path to your SSL key and certificate files.</li>
      <li>Replace /path/to/music with the path to your music library.</li>
      <li>Replace database uri connection string with your PostgreSQL connection string.</li>
      <li>Replace generate via [openssl rand -hex 32] with a randomly generated secret string.</li>
      <li>Change local ports to whatever you want (left side). 4000 is https/3000 is http</li>
      <li>NOTE! WebSockets is only working on https. Fix incoming for http, but use https until then.</li>
    </ul>
  </li>
  <li>Run docker-compose up -d</li>
  <li>The server should be available at the ports provided (4000 for https by default).</li>
  <li>To stop and remove the Nightingale container, run the following command from the same directory as the docker-compose.yml file: <code>docker-compose down</code></li>
</ol>

### Locally

<ol>
  <li>Prerequisites
    <p>
      This method requires (externally):
      <ul>
        <li>FFmpeg</li>
        <li>Postgres database</li>
        <li>Node.js/npm</li>
      </ul>
        <p>The rest of the installation will assume you have these registered and ready to go.</p>
        <p>If you want to use ssl locally, you can follow along this
        <a href="https://gist.github.com/cecilemuller/9492b848eb8fe46d462abeb26656c4f8">guide</a> and generate keys and certs for localhost.</p>
    </p>
  </li>
  <li>Clone the repository.</li>
  <li>Install dependencies via npm install</li>
  <li>Duplicate the .env.copy and rename it to .env</li>
  <li>Add values to the .env:
    <p>Please note: If you're going to be using https, the KEY_PATH and CERT_PATH are required.</p>

    # REQUIRED
    # All specified paths should be absolute
    DATABASE_URL=database connection string
    COOKIE_SECRET=generate via [openssl rand -hex 32]
    MUSIC_DIRECTORY=path to your music library
    # OPTIONAL
    KEY_PATH=path to your privkey.pem
    CERT_PATH=path to your fullchain.pem
    ADDRESS=address to bind to
    HOST=domain/ip you're going to be hosting at
    PROTO=protocol you're going to use (http/https)
    PORT=Port for the https server
    HTTP_PORT=Port for the http server

  </li>
  <li>Start the server with: <code>npm start</code></li>
</ol>

<p align="right">(<a href="#top">back to top</a>)</p>
