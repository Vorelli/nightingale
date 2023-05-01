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

## Installation

<ol>
  <li>
    <h3>Prerequisites</h3>
    <p>
      This repository uses (externally):
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
  <li>
    <h3>Clone the repository.</h3>
  </li>
  <li>
    <h3>Install dependencies via npm install</h3>
  </li>
  <li>
    <h3>Duplicate the .env.copy and rename it to .env</h3>
  </li>
  <li>
    <h3>Add values to the .env:</h3>
    <h3>Please note: If you're going to be using https, the KEY_PATH and CERT_PATH are required.</h3>

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
  <li>
    <h3>Start the server with:</h3>

    npm start

  </li>
</ol>

<p align="right">(<a href="#top">back to top</a>)</p>
