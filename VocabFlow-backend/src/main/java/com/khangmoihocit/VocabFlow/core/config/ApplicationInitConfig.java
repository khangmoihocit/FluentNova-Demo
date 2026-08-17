//package com.khangmoihocit.VocabFlow.core.config;
//
//import com.khangmoihocit.VocabFlow.core.enums.RoleEnum;
//import com.khangmoihocit.VocabFlow.modules.user.entities.User;
//import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
//import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
//import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.ApplicationRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.util.Optional;
//
//@Configuration
//@RequiredArgsConstructor
//@Slf4j(topic = "APPLICATION INIT CONFIG")
//public class ApplicationInitConfig {
//    private final PasswordEncoder passwordEncoder;
//
//    @Bean
//    ApplicationRunner applicationRunner(UserRepository userRepository, VocabularyGroupRepository vocabularyGroupRepository) {
//        return args ->{
//            Optional<User> userAdmin = userRepository.findByEmail("admin@gmail.com");
//            if(userAdmin.isEmpty()){ //không có bản ghi
//                User user = User.builder()
//                        .email("admin@gmail.com")
//                        .passwordHash(passwordEncoder.encode("admin12345"))
//                        .fullName("admin")
//                        .role(RoleEnum.ADMIN.toString())
//                        .build();
//                user = userRepository.save(user);
//                VocabularyGroup vocabularyGroup = VocabularyGroup.builder()
//                        .userId(user.getId())
//                        .name("DEFAULT")
//                        .isDefault(true)
//                        .build();
//                vocabularyGroupRepository.save(vocabularyGroup);
//            }
//        };
//    }
//}
