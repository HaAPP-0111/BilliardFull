package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Product;
import com.dinhquangha.backend.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public Page<Product> list(@PageableDefault(size = 10) Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable long id) { // dùng primitive long
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        Product saved = Objects.requireNonNull(
                productRepository.save(product),
                "Saved product must not be null"
        );

        URI location = Objects.requireNonNull(
                URI.create("/api/products/" + saved.getId())
        );

        return ResponseEntity.created(location).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable long id,   // dùng primitive long
                                          @RequestBody Product payload) {

        return productRepository.findById(id)
                .map(existing -> {
                    existing.setName(payload.getName());
                    existing.setPrice(payload.getPrice());
                    existing.setDescription(payload.getDescription());

                    Product updated = Objects.requireNonNull(
                            productRepository.save(existing),
                            "Updated product must not be null"
                    );

                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {    // dùng primitive long
        return productRepository.findById(id)
                .map(p -> {
                    productRepository.delete(p);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
