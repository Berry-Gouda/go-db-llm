# go-db-llm interface<br>
## Table of Contents
- [About](#about)
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Continued Development](#continued-development)
- [License](#license)
- [Contact](#contact)

## About
This project is a cross-platform desktop application built with Electron for the frontend and Go for the backend, designed to streamline data analysis and cleaning workflows.
The application connects to a MySQL database and integrates with a Large Language Model (LLM) through the Go backend. It provides users with an interactive interface to:
- Bulk Insert CSV's 

- Browse and inspect raw data

- Detect and resolve data quality issues

- Automate transformation and cleaning tasks using AI-powered suggestions

This tool bridges the gap between AI-driven insights and traditional data pipelines, enabling analysts and developers to work more efficiently with messy or incomplete datasets — all from a lightweight, native-feeling desktop environment.

Whether you're preparing data for machine learning, cleaning up inconsistencies, or exploring new datasets, this application brings intelligent automation and user-friendly design to your desktop.

## Overview
This project was born out of necessity — while working with a large and messy dataset, I realized there were no effective tools that combined traditional data management with modern AI-driven cleaning techniques. I wanted to explore how Large Language Models (LLMs) could assist in understanding, cleaning, and transforming raw data, but couldn’t find a solution that integrated seamlessly with existing workflows.

So I built one.

This application combines a native desktop experience (via Electron), a robust backend in Go, and connections to both a MySQL database and a Large Language Model.

It’s a research-driven tool that evolved into a practical solution — and it’s built to scale with real-world datasets.

## Tech Stack
| Layer     | Technology      |
|-----------|-----------------|
| Frontend  | Electron (JS/HTML/CSS) |
| Backend   | Go    |
| Database  | MySQL           |
| LLM  | Llama3-8B-Instruct        |
| Protocol  | REST |

## System Requirements
- Node.js (latest LTS): https://nodejs.org

- Go (1.20+): https://go.dev/dl/

- MySQL: https://www.mysql.com/downloads/

- Llama: https://www.llama.com/llama-downloads/ 

- Git

- Python (3+): https://www.python.org/downloads/

- Any code editor

## Installation

<pre>git clone git@github.com:Berry-Gouda/go-db-llm.git
cd go-db-llm
cd frontend
npm install
cd ../backend
go mod tidy</pre>

## Continued Development

- ### Future Development Plans
    - Display output in frontend instead of backend terminal
    - More Complex Query Generation(ie: between comps, compound clauses, ...)
    - Automatic sql queries generation to update based on Select query
    - UI overhaul

## License
This project is licensed under the MIT License.

## Contact
Maintainer: Roger Silvestri<br>
GitHub: [github.com/berry-g](https://github.com/Berry-Gouda)
