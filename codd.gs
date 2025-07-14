<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>แบบทดสอบ</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f2f5; /* Light gray background */
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .quiz-container {
            background-color: #ffffff;
            border-radius: 1.5rem; /* Rounded corners */
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            width: 100%;
            max-width: 500px;
            position: relative; /* For positioning the close button */
        }
        .option-button {
            transition: all 0.2s ease-in-out;
        }
        .option-button:hover {
            background-color: #e0e7ff; /* Light blue on hover */
            transform: translateY(-2px);
        }
        .option-button.selected {
            background-color: #6366f1; /* Indigo for selected */
            color: white;
            border-color: #4f46e5;
        }
        /* Custom modal styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
    </style>
</head>
<body>
    <div class="quiz-container">
        <!-- Close button (X) for early submission -->
        <button id="closeButton" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold focus:outline-none rounded-full p-2">
            &times;
        </button>

        <div class="text-center text-gray-600 text-sm mb-6">
            <span id="questionCounter">ข้อที่ 1 จาก 136</span>
        </div>

        <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p id="questionText" class="text-lg font-medium text-gray-800 leading-relaxed">
                หากนายอำเภอเข้ามายับยั้งการดำเนินการของสภาตำบล แต่ไม่รายงานผู้ว่าราชการจังหวัดในระยะเวลาที่กำหนด การยับยั้งนั้นจะมีผลอย่างไร
            </p>
        </div>

        <div id="optionsContainer" class="space-y-4 mb-8">
            <!-- Option buttons will be dynamically loaded here -->
            <button class="option-button w-full py-3 px-4 bg-white border border-gray-300 rounded-xl text-left text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                1. ยังมีผลบังคับจนกว่ามีการยืนยันจากกระทรวงมหาดไทย
            </button>
            <button class="option-button w-full py-3 px-4 bg-white border border-gray-300 rounded-xl text-left text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                2. ให้ถือเป็นการเพิกถอนโดยอัตโนมัติ
            </button>
            <button class="option-button w-full py-3 px-4 bg-white border border-gray-300 rounded-xl text-left text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                3. ให้ยับยั้งต่อไปได้ไม่เกิน 60 วัน
            </button>
            <button class="option-button w-full py-3 px-4 bg-white border border-gray-300 rounded-xl text-left text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                4. ให้การยับยั้งเป็นอันสิ้นสุดลง
            </button>
        </div>

        <div class="flex justify-between space-x-4">
            <button id="prevButton" class="w-1/2 py-3 px-4 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50">
                ย้อนกลับ
            </button>
            <button id="nextButton" class="w-1/2 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                ถัดไป
            </button>
        </div>
    </div>

    <!-- Custom Confirmation Modal -->
    <div id="confirmationModal" class="modal-overlay hidden">
        <div class="modal-content">
            <p class="text-xl font-semibold mb-4">ยืนยันการส่งคำตอบ</p>
            <p class="mb-6">คุณต้องการส่งคำตอบตอนนี้หรือไม่? คุณจะไม่สามารถกลับมาทำข้อสอบต่อได้</p>
            <div class="flex justify-center space-x-4">
                <button id="confirmSubmit" class="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    ส่งคำตอบ
                </button>
                <button id="cancelSubmit" class="py-2 px-6 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    ยกเลิก
                </button>
            </div>
        </div>
    </div>

    <script>
        // Placeholder for google.script.run (will be available in Google Apps Script Web App context)
        // In a real Apps Script environment, this will be provided by Google.
        // For local testing, you might mock it or remove this block.
        if (typeof google === 'undefined' || typeof google.script === 'undefined') {
            window.google = {
                script: {
                    run: {
                        saveResult: function(data) {
                            console.log("Mock google.script.run.saveResult called with:", data);
                            return new Promise(resolve => {
                                setTimeout(() => {
                                    console.log("Mock saveResult success!");
                                    resolve({ success: true, message: "บันทึกผลสอบสำเร็จ (จำลอง)" });
                                }, 1000);
                            });
                        }
                    }
                }
            };
        }

        const closeButton = document.getElementById('closeButton');
        const confirmationModal = document.getElementById('confirmationModal');
        const confirmSubmitButton = document.getElementById('confirmSubmit');
        const cancelSubmitButton = document.getElementById('cancelSubmit');

        // Function to show the confirmation modal
        function showConfirmationModal() {
            confirmationModal.classList.remove('hidden');
        }

        // Function to hide the confirmation modal
        function hideConfirmationModal() {
            confirmationModal.classList.add('hidden');
        }

        // Event listener for the close button
        closeButton.addEventListener('click', showConfirmationModal);

        // Event listener for the "ส่งคำตอบ" (Submit) button in the modal
        confirmSubmitButton.addEventListener('click', () => {
            hideConfirmationModal();
            // Call the function to submit the quiz results
            submitQuizEarly();
        });

        // Event listener for the "ยกเลิก" (Cancel) button in the modal
        cancelSubmitButton.addEventListener('click', hideConfirmationModal);

        // --- Placeholder Quiz State and Submission Logic ---
        // In a real application, these would be managed by your quiz logic.
        let quizState = {
            userName: "ผู้ใช้ทดสอบ", // Replace with actual user data
            userCode: "",
            score: 0, // Calculate based on answered questions
            correctAnswers: 0,
            totalQuestions: 136, // Total questions available
            answers: {}, // Store user's answers: {questionId: selectedOptionIndex}
            timeSpent: 0, // Calculate time spent
            ipAddress: "127.0.0.1" // As discussed, this would need a backend proxy for real IP
        };

        // Mock function to simulate quiz progression for demonstration
        function simulateQuizProgress() {
            // This is just for demonstration purposes to show how data might look.
            // In your actual quiz, `quizState.answers`, `score`, `correctAnswers`, `timeSpent`
            // would be updated as the user interacts with the quiz.
            quizState.answers = {
                "Q001": 0, // Example: Question 1 answered with option 0
                "Q002": 2  // Example: Question 2 answered with option 2
            };
            quizState.score = 10; // Example score
            quizState.correctAnswers = 2; // Example correct answers
            quizState.timeSpent = 120; // Example time spent in seconds
        }

        // Call this to simulate some answers being recorded before early submission
        simulateQuizProgress();

        // Function to handle early quiz submission
        function submitQuizEarly() {
            console.log("Attempting to submit quiz early...");

            // In a real app, you would collect the current state of the quiz here:
            // - quizState.userName (from login)
            // - quizState.score (calculated from answered questions)
            // - quizState.correctAnswers (calculated from answered questions)
            // - quizState.answers (map of questionId to selected answer index)
            // - quizState.timeSpent (from a timer)

            // For demonstration, we'll use the simulated `quizState`
            google.script.run
                .withSuccessHandler(function(response) {
                    if (response.success) {
                        alert("ส่งคำตอบสำเร็จ: " + response.message); // Use custom modal in production
                        // Redirect or show a success page
                        console.log("Submission successful!");
                    } else {
                        alert("เกิดข้อผิดพลาดในการส่งคำตอบ: " + response.message); // Use custom modal
                        console.error("Submission failed:", response.message);
                    }
                })
                .withFailureHandler(function(error) {
                    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message); // Use custom modal
                    console.error("Error submitting quiz:", error);
                })
                .saveResult(quizState);
        }

        // --- End Placeholder Quiz State and Submission Logic ---

        // Example of how to handle option selection (for demonstration)
        document.querySelectorAll('.option-button').forEach(button => {
            button.addEventListener('click', function() {
                // Remove 'selected' class from all options
                document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
                // Add 'selected' class to the clicked option
                this.classList.add('selected');
                // In a real quiz, you would save this answer to quizState.answers
                console.log("Option selected:", this.textContent);
            });
        });

        // Placeholder for navigation buttons (Next/Previous)
        document.getElementById('nextButton').addEventListener('click', () => {
            alert("ปุ่มถัดไปถูกกด (ฟังก์ชันยังไม่สมบูรณ์)");
            // Implement logic to load next question and save current answer
        });

        document.getElementById('prevButton').addEventListener('click', () => {
            alert("ปุ่มย้อนกลับถูกกด (ฟังก์ชันยังไม่สมบูรณ์)");
            // Implement logic to load previous question
        });

    </script>
</body>
</html>
