<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $suggestion = trim($input['suggestion'] ?? '');
    
    if (!empty($suggestion)) {
        // Sanitize the input
        $suggestion = htmlspecialchars(strip_tags($suggestion));
        
        $file = 'suggestions.txt';
        $timestamp = date('Y-m-d H:i:s');
        $line = "[$timestamp] " . $suggestion . PHP_EOL;
        
        if (file_put_contents($file, $line, FILE_APPEND | LOCK_EX) !== false) {
            http_response_code(200);
            echo json_encode(['success' => true]);
            exit;
        }
    }
    
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Failed to save suggestion.']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
}
