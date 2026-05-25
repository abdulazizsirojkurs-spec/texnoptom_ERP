#!/bin/bash
cd /Users/macbookpro/.gemini/antigravity-ide/scratch/xisob-kitob-app
git remote remove origin 2>/dev/null
git remote add origin https://github.com/xontorayevabdulaziz/texnoptom-erp.git
git branch -M main
git push -u origin main
echo "TAYYOR! Kodlar GitHub'ga yuklandi!"
