# Mental Health Score Predictor

## Live Demo

[View the Live Application](https://mental-health-score-3-qzrm.onrender.com/)

An end-to-end machine learning web application that predicts students' mental health scores based on social media usage, lifestyle habits, academic information, and stress levels.

## Tech Stack

- Python
- Scikit-learn
- FastAPI
- Pandas
- HTML
- CSS
- JavaScript
- Render

## Project Overview

This project uses a trained machine learning model to predict a student's mental health score from various academic, lifestyle, social media usage, and stress-related factors.

The machine learning model is integrated with a FastAPI backend and connected to an interactive web frontend.

## Features

- Student information input
- Social media usage analysis
- Lifestyle and academic factors
- Mental health score prediction
- Interactive web interface
- REST API using FastAPI
- Cloud deployment using Render

## Machine Learning

The model was trained on student social media and mental health data. The input features include:

- Age
- Gender
- Country
- Academic Level
- Most Used Platform
- Purpose of Use
- Average Daily Usage Hours
- Daily Unlocks
- Study Hours
- Physical Activity Hours
- Sleep Hours Per Night
- Stress Level

## Project Structure

```text
Mental-Health-Score/
├── main.py
├── Mental_Health_Model.pkl
├── requirements.txt
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
