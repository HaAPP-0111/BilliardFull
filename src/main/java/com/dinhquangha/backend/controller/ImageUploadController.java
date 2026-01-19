package com.dinhquangha.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/upload")
public class ImageUploadController {

    private final Path uploadRoot = Paths.get("uploads");

    @PostMapping("/product")
    public ResponseEntity<String> uploadProductImage(@RequestParam("image") MultipartFile file)
            throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        if (!Files.exists(uploadRoot)) {
            Files.createDirectories(uploadRoot);
        }

        String originalFilename = StringUtils.cleanPath(
                Optional.ofNullable(file.getOriginalFilename()).orElse("image")
        );

        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            ext = originalFilename.substring(dot);
        }

        String filename = System.currentTimeMillis() + ext;
        Path dest = uploadRoot.resolve(filename);

        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // URL ảnh để frontend dùng
        String url = "/uploads/" + filename;

        return ResponseEntity.ok(url);
    }
}
